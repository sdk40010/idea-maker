'use strict';
import $ from 'jquery';
const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';
import moment from 'moment-timezone';

$('.favorite-button').each((i, e) => {
  const favoriteButton = $(e);
  favoriteButton.click(() => {
    const userId = favoriteButton.attr('data-user-id');
    const combinationId = favoriteButton.attr('data-combination-id');
    const favorite = parseInt(favoriteButton.attr('data-favorite'));
    const nextFavorite = (favorite + 1) % 2;
    const favoriteIcon = $($('.favorite-icon')[i]);
    const favoriteCounter = $($('.favorite-counter')[i]);
    
    $.post(`/users/${userId}/combinations/${combinationId}`,
      { favorite: nextFavorite },
      (data) => {
        favoriteButton.attr('data-favorite', data.favorite);
        const favoriteIconColor = ['md-dark', 'favorite-icon-pink'];
        favoriteIcon.removeClass('md-dark favorite-icon-pink');
        favoriteIcon.addClass(favoriteIconColor[data.favorite]);
        favoriteCounter.text(data.favoriteCounter);
      }
    );
  });
});

const commentButton = $('#comment-button');
commentButton.click(() => {
  const combinationId = commentButton.attr('data-combination-id');
  const comment = $('textarea[name="comment"]').val();
  const commentCounter = $('.comment-counter');

  if (comment) {
    $.post(`/combinations/${combinationId}/comments`,
      { comment: comment },
      (data) => {
        data.comment.formattedCreatedAt = moment(comment.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
        const commentHtml = getCommentHtml(data.comment);
        $(commentHtml).prependTo('#comment-area');
        $('textarea[name="comment"]').val('');
        commentCounter.text(`${data.commentCounter}件のコメント`);
      });
  }


});

const getCommentHtml = (commentObj) => {
  return `
  <div id="${commentObj.commentNumber}" class="comment-container" >
    <a href="/users/${commentObj.createdBy}/mywords" class="comment-username">${commentObj.user.username}</a>
    <span class="comment-creation-day">${commentObj.formattedCreatedAt}</span>
    <div class="comment">${commentObj.comment}</div>
    <button class="btn btn-outline-secondary btn-sm comment-delete-button" data-combination-id="${commentObj.combinationId}" data-comment-number="${commentObj.commentNumber}">削除</button> 
    <hr>
  </div>`;
};

$('#comment-area').on('click', '.comment-delete-button', function() {
  if (confirm('コメントを削除しますか？')) {
    const combinationId = $(this).attr('data-combination-id');
    const commentNumber = $(this).attr('data-comment-number');
    const commentCounter = $('.comment-counter');

    $.post(`/combinations/${combinationId}/comments/${commentNumber}?delete=1`, null,
      (data) => {
        $(`#${commentNumber}`).remove();
        commentCounter.text(`${data.commentCounter}件のコメント`);
      }
    );
  }
});





