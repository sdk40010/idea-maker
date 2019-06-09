import React from 'react';

export default class Comments extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      comments: [],
      commentCounter: 0,
      commentText: '',
      isSubmitable: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  componentDidMount() {
    this.loadComments();
  }

  loadComments() {
    fetch(`/combinations/${IdeaMaker.combinationId}/comments`).then(res => res.json()).then(json => {
      const comments = json.comments;
      this.userId = json.user.id
      this.setState((prevState, props) => ({
        comments: comments.concat(prevState.comments),
        commentCounter: prevState.commentCounter + comments.length
      }));
    });
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value }, this.setSubmitEnabled);
  }

  setSubmitEnabled() {
    const isNotEmpty = Boolean(this.state.commentText);
    this.setState({
      isSubmitable: isNotEmpty
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.submitComment({ comment: this.state.commentText }).then(json => {
      const comment = [json.comment];
      this.userId = json.user.id
      this.setState((prevState, props) => ({
        comments: comment.concat(prevState.comments),
        commentCounter: prevState.commentCounter + 1,
        commentText: ''
      }));
    });
  }

  submitComment(comment) {
    return fetch(`/combinations/${IdeaMaker.combinationId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(comment)
    }).then(res => res.json());
  }

  handleDelete(event) {
    const commentNumber = event.target.getAttribute('data-comment-number');
    const deleteCommentIndex = this.state.comments.findIndex(comment => comment.commentNumber = commentNumber);
    this.deleteComment(commentNumber).then(json => {
      this.setState((prevState, props) => ({
        comments: this.removeAtIndex(prevState.comments, deleteCommentIndex),
        commentCounter: prevState.commentCounter - 1
      }));
    });
  }

  deleteComment(commentNumber) {
    return fetch(`/combinations/${IdeaMaker.combinationId}/comments/${commentNumber}?delete=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: null
    }).then(res => res.json());
  }

  /**
   * 指定されたインデックスの要素を削除した配列を返す
   * @param {Array} array 
   * @param {Number} index
   * @return {Array}
   */
  removeAtIndex(array, index) {
    const copiedArray = array.slice();
    copiedArray.splice(index, 1);
    return copiedArray;
  }


  render() {
    const commentForm = {
      handleSubmit: this.handleSubmit,
      handleChange: this.handleChange,
      commentText: this.state.commentText,
      isSubmitable: this.state.isSubmitable
    };

    const commentList = {
      commentCounter: this.state.commentCounter,
      comments: this.state.comments,
      userId: this.userId,
      handleDelete: this.handleDelete
    };
    
    return (
      <div>
        <div className="mt-5 mb-3">
          <CommentForm {...commentForm} />
        </div>
        <CommentList {...commentList} />
      </div>
    );
  }
}

class CommentForm extends React.Component {
  render() {
    return (
      <form onSubmit={this.props.handleSubmit}>
        <div className="form-group">
          <textarea
            name="commentText"
            value={this.props.commentText}
            onChange={this.props.handleChange}
            placeholder="コメントを入力"
            rows="4"
            className="form-control" />
        </div>
        <button
          type="submit"
          className="btn btn-main-color"
          disabled={!this.props.isSubmitable}>送信</button>
      </form>
    );
  }
}

class CommentItem extends React.Component {
  render() {
    const comment = this.props.comment;
    console.log("userId: " + this.props.userId);
    return (
      <div className="comment-container">
        <span className="comment-username">{comment.user.username}</span>
        <span className="comment-creation-day">{comment.formattedCreatedAt}</span>
        <div className="comment">{comment.comment}</div>
        {
          parseInt(this.props.userId) === comment.createdBy &&
          <button
            onClick={this.props.handleDelete}
            data-comment-number={comment.commentNumber}
            className="comment-delete-button btn btn-outline-secondary btn-sm">削除</button>
        }
        <hr></hr>
      </div>
    );
  }
}

class CommentList extends React.Component {
  render() {
    const comments = this.props.comments;
    return (
      <div>
        <h3>コメント</h3>
        <p className="comment-counter">{this.props.commentCounter}件のコメント</p>
        <hr></hr>
        <div id="comment-area">
          {comments.map(comment =>
            <CommentItem
              key={comment.commentNumber.toString()}
              comment={comment}
              userId={this.props.userId}
              handleDelete={this.props.handleDelete}/>
          )}
        </div>
      </div> 
    );
  }
}